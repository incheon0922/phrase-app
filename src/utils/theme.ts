import Taro from '@tarojs/taro'

export const APP_THEME = {
  id: 'mint-clear',
  name: 'Mint Clear',
  bg: '#FBFFFD',
  surface: '#EAF3EE',
  accent: '#39B98A',
  text: '#151816',
  muted: '#98AAA2'
}

export function applyThemeChrome() {
  try {
    Taro.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: APP_THEME.bg
    })
  } catch (error) {
    // Ignore unsupported environments.
  }

  try {
    Taro.setTabBarStyle({
      color: APP_THEME.muted,
      selectedColor: APP_THEME.accent,
      backgroundColor: APP_THEME.bg,
      borderStyle: 'white'
    })
  } catch (error) {
    // Ignore unsupported environments.
  }
}
