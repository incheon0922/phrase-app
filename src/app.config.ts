export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/vocabulary-import/index',
    'pages/practice/index',
    'pages/wrong-book/index',
    'pages/mine/index'
  ],
  tabBar: {
    color: '#98AAA2',
    selectedColor: '#39B98A',
    backgroundColor: '#FCFFFD',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-active.png'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/tabbar/mine.png',
        selectedIconPath: 'assets/tabbar/mine-active.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    backgroundColor: '#FCFFFD',
    navigationBarBackgroundColor: '#FCFFFD',
    navigationBarTitleText: '词汇积累',
    navigationBarTextStyle: 'black'
  }
})
