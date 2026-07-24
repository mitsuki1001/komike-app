<template>
  <div>
    <h1>ログイン</h1>

    <form @submit.prevent="login">

      <div>
        <label>ユーザー名</label>
        <input
          v-model="name"
          required
        />
      </div>

      <div>
        <label>パスワード</label>
        <input
          type="password"
          v-model="password"
          required
        />
      </div>

      <button type="submit">
        ログイン
      </button>

    </form>

    <router-link to="/user-register">
      ユーザー登録
    </router-link>

  </div>
</template>

<script>
import axios from 'axios';

// const baseURL = 'http://localhost:3000';
const baseURL = process.env.VUE_APP_API_BASE_URL;

export default {
  name: 'UserLogin',

  data() {
    return {
      name: '',
      password: ''
    };
  },

  methods: {

    async login() {

      try {

        const response =
          await axios.post(
            `${baseURL}/login`,
            {
              name: this.name,
              password: this.password
            }
          );

        localStorage.setItem(
          'token',
          response.data.token
        );

        localStorage.setItem(
          'userName',
          response.data.name
        );

        localStorage.setItem(
          'isAdmin',
          response.data.isAdmin
        );

        alert('ログインしました');

        window.location.href = '/circles';

      } catch (error) {

        console.error(error);

        alert(
          error.response?.data?.message ||
          'ログインに失敗しました'
        );

      }
    }
  }
};
</script>