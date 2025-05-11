# RankBot起動方法

```
dockerとcomposeがインストールされてること
```

1. NVMのインストール
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
```

2. nodeのインストール
```
nvm install node
```

3. corepackのインストール&pnpmの有効化
```
npm install --global corepack@latest
corepack enable pnpm
```

4. node_modulesインストール
```
pnpm i
```

5. docker起動

※最初のsetIntervalでエラーになるけど初回起動は無視していい

```
docker compose up -d
```
6. テーブル作成
```
pnpm generate
```