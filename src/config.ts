import { FunctionDeclaration } from "./api/payload.api";

export const config: {
  responseMimeType: string;
  systemInstruction?: { text: string }[];
  tools?: {
    functionDeclarations: FunctionDeclaration[]
  }[]
} = {
  responseMimeType: "text/plain",
  systemInstruction: [
    {
      text: "Você é um agente de I.A, pronto para executar qualquer tipo de tarefa."
    }
  ],
  tools: [
    {
      functionDeclarations: [
        {
          "name": "create_file",
          "description": "Cria um arquivo no computador.",
          "parameters": {
            type: "OBJECT",
            "required": [
              "path"
            ],
            properties: {
              path: {
                type: "STRING"
              },
              "content": {
                type: "STRING"
              }
            }
          }
        },
        {
          "name": "execute_command",
          "description": "Executa um comando no computador.",
          "parameters": {
            type: "OBJECT",
            "required": [
              "command"
            ],
            properties: {
              "command": {
                type: "STRING"
              }
            }
          }
        },
        {
          "name": "read_file",
          "description": "Lê um arquivo do computador.",
          "parameters": {
            type: "OBJECT",
            "required": [
              "path"
            ],
            properties: {
              path: {
                type: "STRING"
              }
            }
          }
        },
        {
          "name": "make_dir",
          "description": "Cria uma pasta no computador.",
          "parameters": {
            type: "OBJECT",
            "required": [
              "path",
              "recursive"
            ],
            properties: {
              path: {
                type: "STRING"
              },
              "recursive": {
                type: "BOOLEAN"
              }
            }
          }
        },
        {
          "name": "delete_file",
          "description": "Deleta um arquivo do computador.",
          "parameters": {
            type: "OBJECT",
            "required": [
              "path"
            ],
            properties: {
              path: {
                type: "STRING"
              }
            }
          }
        },
        {
          "name": "delete_dir",
          "description": "Deleta uma pasta do computador.",
          "parameters": {
            type: "OBJECT",
            "required": [
              "path",
              "recursive"
            ],
            properties: {
              path: {
                type: "STRING"
              },
              "recursive": {
                type: "BOOLEAN"
              }
            }
          }
        },
        {
          "name": "list_dir",
          "description": "Lista os arquivos e pastas do computador.",
          "parameters": {
            type: "OBJECT",
            "required": [
              "path"
            ],
            properties: {
              path: {
                type: "STRING"
              }
            }
          }
        },
        {
          name: "https_request",
          description: "Faz uma requisição HTTP.",
          parameters: {
            type: "OBJECT",
            required: [
              "url",
              "method",
              "headers",
            ],
            properties: {
              url: {
                type: "STRING"
              },
              method: {
                type: "STRING"
              },
              body: {
                type: "STRING"
              },
              headers: {
                type: "OBJECT",
                required: ["Content-Type", "Origin", "User-Agent", "Referer"],
                properties: {
                  "Content-Type": {
                    type: "STRING"
                  },
                  "Origin": {
                    type: "STRING"
                  },
                  "User-Agent": {
                    type: "STRING"
                  },
                  "Referer": {
                    type: "STRING"
                  },
                },
              }
            }
          }
        },
        {
          name: "screenshot",
          description: "Tira uma captura de tela.",
          parameters: {
            type: "OBJECT",
            properties: {}
          }
        }
      ]
    }
  ]
}