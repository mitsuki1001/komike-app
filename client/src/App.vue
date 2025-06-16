<template>
  <div id="app">
    <nav>
      <router-link to="/">登録ページ</router-link> | 
      <router-link to="/circles">一覧ページ</router-link> | 
      <router-link to="/venue-map">会場マップ</router-link> |
      <router-link to="/ocr">OCRページ</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
};
</script>

<style>
nav {
  margin-bottom: 20px;
}
router-link {
  margin-right: 10px;
}
</style>
