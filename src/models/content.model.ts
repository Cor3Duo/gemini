import { Role } from "../api/role.api";

export type Content = {
  role: Role,
  parts: { text: string }[]
}

export class ContentModel {

  constructor(
    public role: Role,
    public parts: { text: string }[]
  ) { }

  serialize(): Content {
    return {
      role: this.role,
      parts: this.parts
    }
  }

}