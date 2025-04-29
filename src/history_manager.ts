import { GeminiClient } from "./gemini_client";
import { Content, ContentModel } from "./models/content.model";

export class HistoryManager {

  contents: ContentModel[] = [];

  get client() {
    return this._client;
  }

  constructor(
    private _client: GeminiClient
  ) {
  }

  private serialize() {
    const contents: Content[] = [];
    for (const content of this.contents) {
      contents.push(content.serialize());
    }
    return contents;
  }

  addText(role: "model" | "user" = "model", text: string) {
    this.contents.push(new ContentModel(role, [{ text }]));
    return this;
  }

  addImage() {
    throw new Error("Method not implemented.");
    return this;
  }

  addAudio() {
    throw new Error("Method not implemented.");
    return this;
  }

  addVideo() {
    throw new Error("Method not implemented.");
    return this;
  }

  addFunctionCall(name: string, args: any) {
    this.contents.push(new ContentModel("model", [{ functionCall: { name, args } }]));
    return this;
  }

  addFunctionResponse(name: string, result: string) {
    this.contents.push(new ContentModel("user", [{ functionResponse: { name, response: { result } } }]));
    return this;
  }

  getResponse() {
    return this._client.send({
      model: "gemini-2.5-pro-preview-03-25",
      config: {
        responseMimeType: "text/plain",
        systemInstruction: [
          {
            text: `Você é um agente de I.A, pronto para executar qualquer tipo de tarefa.`,
          }
        ],
        tools: [
          {
            functionDeclarations: [
              {
                name: "create_file",
                description: "Cria um arquivo no computador.",
                parameters: {
                  type: "OBJECT",
                  required: ["path"],
                  properties: {
                    path: {
                      type: "STRING"
                    },
                    content: {
                      type: "STRING"
                    }
                  },
                }
              },
              {
                name: "execute_command",
                description: "Executa um comando no computador.",
                parameters: {
                  type: "OBJECT",
                  required: ["command"],
                  properties: {
                    command: {
                      type: "STRING"
                    }
                  },
                }
              },
              {
                name: "read_file",
                description: "Lê um arquivo do computador.",
                parameters: {
                  type: "OBJECT",
                  required: ["path"],
                  properties: {
                    path: {
                      type: "STRING"
                    }
                  },
                }
              }
            ],
          }
        ]
      },
      contents: this.serialize()
    });
  }

}