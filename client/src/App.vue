<template>
  <div id="app">
    <nav>
      <router-link to="/">登録ページ</router-link> |
      <router-link to="/circles">一覧ページ</router-link> |
      <router-link to="/venue-map">会場マップ</router-link> |
      <router-link to="/ocr">OCRページ</router-link> |
      <router-link to="/settlement">精算ページ</router-link> |

      <template v-if="userName">
        <span class="user-name">{{ userName }} さん</span>
        <button @click="logout">ログアウト</button>
      </template>

      <template v-else>
        <router-link to="/user-login">ログイン</router-link> |
        <router-link to="/user-register">ユーザー登録</router-link>
      </template>

    </nav>

    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',

  computed: {
    userName() {
      return localStorage.getItem('userName');
    }
  },

  methods: {
    logout() {

      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      localStorage.removeItem('isAdmin');

      alert('ログアウトしました');

      this.$router.push('/user-login');

      window.location.reload();
    }
  }
};
</script>

<style>
nav {
  margin-bottom: 20px;
}

nav a {
  margin-right: 10px;
}

.user-name {
  margin-left: 20px;
  margin-right: 15px;
  font-weight: bold;
}
</style>