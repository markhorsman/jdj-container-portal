// vue.config.js
module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        "productName": "InspHire Portal",
        "appId": "insphire.portal.app",
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
          "icon": "./build/icon.ico"
        }
      },
      externals: [
        'nfc-pcsc',
        'iohook'
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
