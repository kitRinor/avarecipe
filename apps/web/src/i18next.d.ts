import "i18next";
// 日本語ファイルを「正」として型定義に使います
import ja from "./locales/ja.json";

declare module "i18next" {
  interface CustomTypeOptions {
    // デフォルトのネームスペース (翻訳ファイルのキーがない場合はこれを使う)
    defaultNS: "translation";
    // リソースの型定義
    resources: {
      translation: typeof ja;
    };
  }
}