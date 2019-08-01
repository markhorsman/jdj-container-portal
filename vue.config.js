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
          "publish": {
            "provider": "github",
            "owner": "markhorsman",
            "repo": "jdj-container-portal"
          }
        },
        "linux": {
          "target": [
            "deb",
            "AppImage"
          ],
          "publish": {
            "provider": "github",
            "owner": "markhorsman",
            "repo": "jdj-container-portal"
          },
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
