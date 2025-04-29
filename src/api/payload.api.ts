import { Content } from "../models/content.model";

type Type = (ObjectType | ArrayType | { type: "string" | "number" | "boolean"; }) & { description?: string };

interface ArrayType {
  type: "array";
  items: {
    type: Type;
  }
}

interface ObjectType {
  type: "object";
  required?: string[];
  properties: {
    [key: string]: Type;
  }
}

interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: ObjectType;
}

export interface Payload {
  model: string;
  config: {
    responseMimeType: string;
    systemInstruction?: { text: string }[];
    tools?: {
      functionDeclarations: FunctionDeclaration[]
    }[]
  };
  contents: Content[];
}