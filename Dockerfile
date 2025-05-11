FROM node:23-slim

# 作業ディレクトリ
WORKDIR /app

# すべてのファイルをコピー
COPY . .

# pnpmをグローバルインストール
RUN npm install -g pnpm


# 依存関係をインストール
RUN pnpm install



# RUN ["pnpm", "generate"]
CMD ["pnpm", "botlogin"]