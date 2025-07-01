const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true
  pages: {
    index: {
      entry: 'src/main.js',
      title: 'あなたのサイト名' // ← ここを好きな名前に変更
    }
  }
})
