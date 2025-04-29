import { config } from "./config";
import { GeminiClient } from "./gemini_client";
import { Content, ContentModel } from "./models/content.model";
import fs from "fs";

export class HistoryManager {

  contents: ContentModel[] = [];

  get client() {
    return this._client;
  }

  constructor(
    private _client: GeminiClient
  ) {
    // if (fs.existsSync("data/history.json")) {
    //   this.deserialize(JSON.parse(fs.readFileSync("data/history.json", "utf-8")));
    // }
  }

  private serialize() {
    const contents: Content[] = [];
    for (const content of this.contents) {
      contents.push(content.serialize());
    }
    return contents;
  }

  private deserialize(contents: Content[]) {
    this.contents = [];
    for (const content of contents) {
      this.contents.push(new ContentModel(content.role, content.parts));
    }
  }

  addText(role: "model" | "user" = "model", text: string) {
    this.contents.push(new ContentModel(role, [{ text }]));
    return this;
  }

  addImage(mimeType: "image/png" | "image/jpeg", data: string, text?: string) {
    const parts: any = [
      {
        inlineData: {
          mimeType: mimeType,
          data
        }
      }
    ];
    if (text) {
      parts.push({ text });
    }
    this.contents.push(new ContentModel("user", parts));
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
    fs.writeFileSync("data/history.json", JSON.stringify(this.serialize()));
    return this._client.send({
      model: "gemini-2.5-pro-preview-03-25",
      config: config,
      contents: this.serialize()
    });
  }

}