import { Block, BLOCK_TYPES } from "../types/Block";

/**
 * Returns a new block object with the new type, transferring content smartly and clearing old fields.
 * Follows the schema: single→multi (first field), multi→single (join), same count (map 1:1).
 * All old fields are cleared/removed after content transfer.
 */
export function changeBlockTypeClearData(
  oldBlock: Block,
  newType: Block["type"],
): Block {
  const oldFields = BLOCK_TYPES[oldBlock.type].fields;
  const newFields = BLOCK_TYPES[newType].fields;
  const allPossibleFields = Object.keys(BLOCK_TYPES).flatMap(
    (type) => BLOCK_TYPES[type as Block["type"]].fields,
  );

  // Gather non-empty values from old block fields (in order)
  const oldValues: string[] = [];
  for (const field of oldFields) {
    const val = (oldBlock as any)[field];
    if (typeof val === "string" && val.trim() !== "") {
      oldValues.push(val);
    }
  }

  // Prepare new block with core properties
  const newBlock: Block = {
    ...oldBlock,
    type: newType,
    completed: newType === "todoblock"
      ? (oldBlock.type === "todoblock" ? oldBlock.completed : false)
      : undefined,
  };

  // Smart content transfer based on field count relationship
  if (oldValues.length === 0) {
    // No content to transfer - initialize all new fields as empty
    for (const field of newFields) {
      (newBlock as any)[field] = "";
    }
  } else if (newFields.length === 1) {
    // Multi/Single → Single Field: join all old values with newlines
    (newBlock as any)[newFields[0]] = oldValues.join("\n");
  } else if (oldValues.length === 1) {
    // Single → Multi Field: put content in first field, rest empty
    (newBlock as any)[newFields[0]] = oldValues[0];
    for (let i = 1; i < newFields.length; i++) {
      (newBlock as any)[newFields[i]] = "";
    }
  } else {
    // Multi → Multi Field: map 1:1, then handle extras
    for (let i = 0; i < newFields.length; i++) {
      if (i < oldValues.length) {
        (newBlock as any)[newFields[i]] = oldValues[i];
      } else {
        (newBlock as any)[newFields[i]] = "";
      }
    }

    // If more old values than new fields, join extras into last field
    if (oldValues.length > newFields.length) {
      const lastFieldIndex = newFields.length - 1;
      const existingContent = (newBlock as any)[newFields[lastFieldIndex]];
      const extraValues = oldValues.slice(newFields.length);
      (newBlock as any)[newFields[lastFieldIndex]] = existingContent
        ? `${existingContent}\n${extraValues.join("\n")}`
        : extraValues.join("\n");
    }
  }

  // Clear all old fields that don't belong to the new type
  for (const field of allPossibleFields) {
    if (!newFields.includes(field)) {
      delete (newBlock as any)[field];
    }
  }

  return newBlock;
}

/**
 * Returns a new block object with the new type, preserving as much data as possible.
 * Joins all old field values with newlines if needed, so nothing is lost.
 * @deprecated Use changeBlockTypeClearData instead for better UX
 */
export function changeBlockTypePreserveData(
  oldBlock: Block,
  newType: Block["type"],
): Block {
  const newFields = BLOCK_TYPES[newType].fields;
  const allPossibleFields = Object.keys(BLOCK_TYPES).flatMap(
    (type) => BLOCK_TYPES[type as Block["type"]].fields,
  );

  // Gather all non-empty values from the old block
  const oldValues: string[] = [];
  for (const field of allPossibleFields) {
    const val = (oldBlock as any)[field];
    if (typeof val === "string" && val.trim() !== "") {
      oldValues.push(val);
    }
  }

  // Prepare new block
  const newBlock: Block = {
    ...oldBlock,
    type: newType,
    completed: newType === "todoblock" ? oldBlock.completed : undefined,
  };

  // Assign values to new fields
  if (newFields.length === 1) {
    // Join all old values with newlines
    (newBlock as any)[newFields[0]] = oldValues.join("\n");
    // Clear other possible fields
    for (const field of allPossibleFields as string[]) {
      if (field !== newFields[0]) delete (newBlock as any)[field];
    }
  } else {
    // Assign as many as possible, join extras into last field
    for (let i = 0; i < newFields.length; i++) {
      if (i < oldValues.length) {
        (newBlock as any)[newFields[i]] = oldValues[i];
      } else if (
        i === newFields.length - 1 &&
        oldValues.length > newFields.length
      ) {
        // Join remaining values into last field
        (newBlock as any)[newFields[i]] = oldValues.slice(i).join("\n");
      } else {
        (newBlock as any)[newFields[i]] = "";
      }
    }
    // Clear other possible fields
    for (const field of allPossibleFields as string[]) {
      if (!(Array.from(newFields).map(String).includes(String(field)))) {
        delete (newBlock as any)[field];
      }
    }
  }

  return newBlock;
}
