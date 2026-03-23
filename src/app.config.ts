export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/vocabulary-import/index',
    'pages/practice/index',
    'pages/mine/index'
  ],
  tabBar: {
    color: '#7A746B',
    selectedColor: '#2F5D50',
    backgroundColor: '#FFFDF8',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    backgroundColor: '#F7F3EA',
    navigationBarBackgroundColor: '#F7F3EA',
    navigationBarTitleText: '成语积累',
    navigationBarTextStyle: 'black'
  }
})
