// vue.config.js
module.exports = {
  pluginOptions: {
    electronBuilder: {
      externals: [
        'nfc-pcsc'
      ],
      nodeModulesPath: [
        '../../node_modules',
        './node_modules'
      ]
    },
    quasar: {
      treeShake: true
    }
  },

  transpileDependencies: [
    /[\\\/]node_modules[\\\/]quasar[\\\/]/
  ]
}
