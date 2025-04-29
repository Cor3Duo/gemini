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

  getResponse() {
    return this._client.send({
      model: "gemini-2.5-pro-preview-03-25",
      config: {
        responseMimeType: "text/plain",
        systemInstruction: [
          {
            text: `Você é um moderador de um canal na twitch.tv`,
          }
        ],
        tools: [
          {
            functionDeclarations: [
              {
                name: "ban",
                description: "Bane um usuário caso se comporte mal no chat.",
                parameters: {
                  type: "object",
                  properties: {
                    username: {
                      type: "string"
                    },
                    reason: {
                      type: "string"
                    },
                    duration: {
                      type: "number"
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