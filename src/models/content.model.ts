import { Role } from "../api/role.api";

interface TextPart {
  text: string;
}

interface FunctionCallPart {
  functionCall: {
    name: string;
    args: any;
  }
}

interface FunctionResponsePart {
  functionResponse: {
    name: string;
    response: { result: string };
  }
}

export type Content = {
  role: Role,
  parts: TextPart[] | FunctionCallPart[] | FunctionResponsePart[]
}

export class ContentModel {

  constructor(
    public role: Role,
    public parts: TextPart[] | FunctionCallPart[] | FunctionResponsePart[]
  ) { }

  serialize(): Content {
    return {
      role: this.role,
      parts: this.parts
    }
  }

}