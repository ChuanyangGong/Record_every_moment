const path = require('path')
module.exports = {
  packagerConfig: {
    icon: path.join(__dirname, './images/icon.ico'),
    name: "REM",
    // asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32'],
      config: {
      },
    },
    {
      name: '@electron-forge/maker-squirrel',
      config: {
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
};
