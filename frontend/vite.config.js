export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:10000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  base: '',
  build: {
    outDir: '../dist',
  },
}
