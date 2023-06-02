export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:7000',
        changeOrigin: true,
        secure: false,
      },
    },
    // watch: {
    //   usePolling: true,
    // },
    // host: true, // needed for the Docker Container port mapping to work
    // strictPort: true,
    // port: 5173, // you can replace this port with any port
  },
  base: '',
  build: {
    outDir: '../dist',
  },
}
