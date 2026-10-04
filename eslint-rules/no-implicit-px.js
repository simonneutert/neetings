import ts from "typescript";

// Copied from preact/compat/src/util.js: the style keys compat treats as
// unitless and therefore never suffixes with "px".
const IS_NON_DIMENSIONAL =
	/^(-|f[lo].*[^se]$|g.{5,}[^ps]$|z|o[pr]|(W.{5})?[lL]i.*(t|mp)$|an|(bo|s).{4}Im|sca|m.{6}[ds]|ta|c.*[st]$|wido|ini)/;

// Valid as plain numbers in CSS, but missing from compat's list.
const EXTRA_UNITLESS = new Set([
	"aspectRatio",
	"strokeWidth",
	"strokeDashoffset",
	"strokeMiterlimit",
]);

/** @param {string} key */
const isUnitless = (key) =>
	IS_NON_DIMENSIONAL.test(key) || EXTRA_UNITLESS.has(key);

/**
 * Preact 11 core no longer appends "px" to numeric style values; only
 * preact/compat does. This app loads compat only indirectly (memo imports,
 * @dnd-kit's react alias), so `{ maxWidth: 500 }` works today but would render
 * as "max-width:500" (ignored by the browser) if compat were ever dropped.
 * Requiring explicit units keeps styles independent of that.
 *
 * Literals are checked syntactically. With type information (projectService),
 * ternaries, variables, arithmetic and calls are checked by their type too.
 */
/** @type {import("eslint").Rule.RuleModule} */
export default {
	meta: {
		type: "problem",
		docs: {
			description:
				'Disallow numeric style values that rely on preact/compat adding "px"',
		},
		messages: {
			implicitPx:
				'Numeric value for "{{key}}" relies on preact/compat adding "px" (Preact 11 core does not). Use a string with a unit, e.g. "500px".',
		},
		schema: [],
	},

	create(context) {
		const services = context.sourceCode.parserServices;
		const checker = services?.program?.getTypeChecker();

		/** @param {ts.Type} type */
		const isNonZeroNumberType = (type) =>
			(type.isUnion() ? type.types : [type]).some(
				(/** @type {ts.Type} */ t) =>
					t.flags & ts.TypeFlags.NumberLike &&
					!(t.isNumberLiteral() && t.value === 0),
			);

		/** @param {any} node */
		const mayBeNonZeroNumber = (node) => {
			if (node.type === "Literal") {
				return typeof node.value === "number" && node.value !== 0;
			}
			if (node.type === "UnaryExpression" && node.argument.type === "Literal") {
				return typeof node.argument.value === "number" &&
					node.argument.value !== 0;
			}
			if (!checker) return false;
			const tsNode = services.esTreeNodeToTSNodeMap.get(node);
			return isNonZeroNumberType(checker.getTypeAtLocation(tsNode));
		};

		return {
			// Only the style object's own properties, not objects nested in calls.
			'JSXAttribute[name.name="style"] > JSXExpressionContainer > ObjectExpression > Property'(
				/** @type {any} */ node,
			) {
				if (node.computed) return;
				const key = node.key.type === "Identifier"
					? node.key.name
					: node.key.value;
				if (typeof key !== "string" || isUnitless(key)) return;
				if (mayBeNonZeroNumber(node.value)) {
					context.report({
						node: node.value,
						messageId: "implicitPx",
						data: { key },
					});
				}
			},
		};
	},
};
