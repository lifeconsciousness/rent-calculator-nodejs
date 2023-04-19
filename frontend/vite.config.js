export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:7000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
}
