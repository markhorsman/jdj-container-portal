// vue.config.js
module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        "productName": "JDJ Container Portal",
        "appId": "jdj.container.portal.app",
        "copyright": "Copyright © year ${author}",
        "win": {
          "target": "nsis",
          "publish": ["github"]
        },
        "linux": {
          "target": [
            "deb",
            "AppImage"
          ],
          "icon": "./build/icons/png/256x256.png"
        }
      },
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
