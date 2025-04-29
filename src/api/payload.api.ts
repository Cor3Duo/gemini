import { Content } from "../models/content.model";

type Type = (ObjectType | ArrayType | { type: "STRING" | "NUMBER" | "BOOLEAN"; }) & { description?: string };

interface ArrayType {
  type: "ARRAY";
  items: {
    type: Type;
  }
}

interface ObjectType {
  type: "OBJECT";
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