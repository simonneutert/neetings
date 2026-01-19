import { describe, expect, it } from "vitest";
import { changeBlockTypeClearData } from "../utils/blockTypeChange";
import { Block, createBlock } from "../types/Block";

describe("Smart Block Type Change Transfer", () => {
  describe("Single Field → Multi Field", () => {
    it("Note → Q&A: transfers text to question, answer empty", () => {
      const noteBlock: Block = {
        ...createBlock("textblock", null, "m"),
        text: "What is the meaning of life?",
      };

      const qandaBlock = changeBlockTypeClearData(noteBlock, "qandablock");

      expect(qandaBlock.type).toBe("qandablock");
      expect((qandaBlock as any).question).toBe("What is the meaning of life?");
      expect((qandaBlock as any).answer).toBe("");
      expect((qandaBlock as any).text).toBeUndefined(); // old field cleared
    });

    it("Note → Research: transfers text to topic, result empty", () => {
      const noteBlock: Block = {
        ...createBlock("textblock", null, "m"),
        text: "We should use TypeScript",
      };

      const researchBlock = changeBlockTypeClearData(
        noteBlock,
        "researchblock",
      );

      expect(researchBlock.type).toBe("researchblock");
      expect((researchBlock as any).topic).toBe("We should use TypeScript");
      expect((researchBlock as any).result).toBe("");
      expect((researchBlock as any).text).toBeUndefined(); // old field cleared
    });
  });

  describe("Multi Field → Single Field", () => {
    it("Q&A → Note: joins question and answer with newline", () => {
      const qandaBlock: Block = {
        ...createBlock("qandablock", null, "m"),
        question: "What is 2+2?",
        answer: "4",
      };

      const noteBlock = changeBlockTypeClearData(qandaBlock, "textblock");

      expect(noteBlock.type).toBe("textblock");
      expect((noteBlock as any).text).toBe("What is 2+2?\n4");
      expect((noteBlock as any).question).toBeUndefined(); // old field cleared
      expect((noteBlock as any).answer).toBeUndefined(); // old field cleared
    });

    it("Research → Note: joins topic and result with newline", () => {
      const researchBlock: Block = {
        ...createBlock("researchblock", null, "m"),
        topic: "React vs Vue performance",
        result: "React shows 15% better performance in our use case",
      };

      const noteBlock = changeBlockTypeClearData(researchBlock, "textblock");

      expect(noteBlock.type).toBe("textblock");
      expect((noteBlock as any).text).toBe(
        "React vs Vue performance\nReact shows 15% better performance in our use case",
      );
      expect((noteBlock as any).topic).toBeUndefined(); // old field cleared
      expect((noteBlock as any).result).toBeUndefined(); // old field cleared
    });
  });

  describe("Single Field → Single Field", () => {
    it("Note → Goal: transfers text to goal", () => {
      const noteBlock: Block = {
        ...createBlock("textblock", null, "m"),
        text: "Increase user engagement by 25%",
      };

      const goalBlock = changeBlockTypeClearData(noteBlock, "goalblock");

      expect(goalBlock.type).toBe("goalblock");
      expect((goalBlock as any).goal).toBe("Increase user engagement by 25%");
      expect((goalBlock as any).text).toBeUndefined(); // old field cleared
    });

    it("TODO → Idea: transfers todo to idea, loses completion status", () => {
      const todoBlock: Block = {
        ...createBlock("todoblock", null, "m"),
        todo: "Implement dark mode",
        completed: true,
      };

      const ideaBlock = changeBlockTypeClearData(todoBlock, "ideablock");

      expect(ideaBlock.type).toBe("ideablock");
      expect((ideaBlock as any).idea).toBe("Implement dark mode");
      expect(ideaBlock.completed).toBeUndefined(); // completion status lost
      expect((ideaBlock as any).todo).toBeUndefined(); // old field cleared
    });
  });

  describe("Multi Field → Multi Field", () => {
    it("Q&A → Research: maps question→topic, answer→result", () => {
      const qandaBlock: Block = {
        ...createBlock("qandablock", null, "m"),
        question: "Should we migrate to TypeScript?",
        answer: "Yes, for better type safety",
      };

      const researchBlock = changeBlockTypeClearData(
        qandaBlock,
        "researchblock",
      );

      expect(researchBlock.type).toBe("researchblock");
      expect((researchBlock as any).topic).toBe(
        "Should we migrate to TypeScript?",
      );
      expect((researchBlock as any).result).toBe("Yes, for better type safety");
      expect((researchBlock as any).question).toBeUndefined(); // old field cleared
      expect((researchBlock as any).answer).toBeUndefined(); // old field cleared
    });

    it("Research → Q&A: maps topic→question, result→answer", () => {
      const researchBlock: Block = {
        ...createBlock("researchblock", null, "m"),
        topic: "Microservices vs Monolith",
        result:
          "Microservices provide better scalability but increase complexity",
      };

      const qandaBlock = changeBlockTypeClearData(researchBlock, "qandablock");

      expect(qandaBlock.type).toBe("qandablock");
      expect((qandaBlock as any).question).toBe("Microservices vs Monolith");
      expect((qandaBlock as any).answer).toBe(
        "Microservices provide better scalability but increase complexity",
      );
      expect((qandaBlock as any).topic).toBeUndefined(); // old field cleared
      expect((qandaBlock as any).result).toBeUndefined(); // old field cleared
    });
  });

  describe("Special Cases: TODO handling", () => {
    it("Any → TODO: transfers content to todo, starts uncompleted", () => {
      const noteBlock: Block = {
        ...createBlock("textblock", null, "m"),
        text: "Review the pull request",
      };

      const todoBlock = changeBlockTypeClearData(noteBlock, "todoblock");

      expect(todoBlock.type).toBe("todoblock");
      expect((todoBlock as any).todo).toBe("Review the pull request");
      expect(todoBlock.completed).toBe(false); // starts uncompleted
      expect((todoBlock as any).text).toBeUndefined(); // old field cleared
    });

    it("TODO → TODO: preserves completion status", () => {
      const todoBlock: Block = {
        ...createBlock("todoblock", null, "m"),
        todo: "Completed task",
        completed: true,
      };

      const newTodoBlock = changeBlockTypeClearData(todoBlock, "todoblock");

      expect(newTodoBlock.type).toBe("todoblock");
      expect((newTodoBlock as any).todo).toBe("Completed task");
      expect(newTodoBlock.completed).toBe(true); // preserves completion
    });

    it("TODO → Any: transfers todo content, loses completion", () => {
      const todoBlock: Block = {
        ...createBlock("todoblock", null, "m"),
        todo: "Write documentation",
        completed: true,
      };

      const noteBlock = changeBlockTypeClearData(todoBlock, "textblock");

      expect(noteBlock.type).toBe("textblock");
      expect((noteBlock as any).text).toBe("Write documentation");
      expect(noteBlock.completed).toBeUndefined(); // completion lost
      expect((noteBlock as any).todo).toBeUndefined(); // old field cleared
    });
  });

  describe("Edge Cases", () => {
    it("handles empty content gracefully", () => {
      const emptyBlock: Block = {
        ...createBlock("textblock", null, "m"),
        text: "",
      };

      const qandaBlock = changeBlockTypeClearData(emptyBlock, "qandablock");

      expect(qandaBlock.type).toBe("qandablock");
      expect((qandaBlock as any).question).toBe(""); // empty but defined
      expect((qandaBlock as any).answer).toBe(""); // empty but defined
    });

    it("handles whitespace-only content", () => {
      const whitespaceBlock: Block = {
        ...createBlock("textblock", null, "m"),
        text: "   \n\t  ",
      };

      const goalBlock = changeBlockTypeClearData(whitespaceBlock, "goalblock");

      expect(goalBlock.type).toBe("goalblock");
      expect((goalBlock as any).goal).toBe(""); // whitespace treated as empty
    });

    it("preserves core block properties", () => {
      const originalBlock: Block = {
        ...createBlock("textblock", "topic1", "abc123"),
        text: "Original content",
      };
      originalBlock.created_at = "2024-01-01T00:00:00.000Z";

      const changedBlock = changeBlockTypeClearData(originalBlock, "goalblock");

      expect(changedBlock.id).toBe(originalBlock.id);
      expect(changedBlock.topicGroupId).toBe(originalBlock.topicGroupId);
      expect(changedBlock.sortKey).toBe(originalBlock.sortKey);
      expect(changedBlock.created_at).toBe(originalBlock.created_at);
    });
  });

  describe("Real-world scenario: Q&A → Note → Q&A", () => {
    it("Q&A → Note → Q&A preserves content intelligently", () => {
      // Start with Q&A
      const originalQA: Block = {
        ...createBlock("qandablock", null, "m"),
        question: "What is the capital of France?",
        answer: "Paris",
      };

      // Change to Note
      const noteBlock = changeBlockTypeClearData(originalQA, "textblock");
      expect((noteBlock as any).text).toBe(
        "What is the capital of France?\nParis",
      );
      expect((noteBlock as any).question).toBeUndefined();
      expect((noteBlock as any).answer).toBeUndefined();

      // Change back to Q&A
      const finalQA = changeBlockTypeClearData(noteBlock, "qandablock");
      expect((finalQA as any).question).toBe(
        "What is the capital of France?\nParis",
      );
      expect((finalQA as any).answer).toBe("");
      expect((finalQA as any).text).toBeUndefined();
    });
  });
});
