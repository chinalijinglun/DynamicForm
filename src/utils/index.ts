/**
 * 简易防抖函数
 * @param {Function} func -防抖目标函数
 * @param {Number}} gap - 防抖时间间隔
 */
 export const debounce = ( func, gap ) => {
    let timer
    return function () {
      timer && clearTimeout( timer )
      timer = setTimeout( () => {
        func.apply( this, arguments )
      }, gap )
    }
  }
  /**
   * 下划线转驼峰
   * @param {String} name - 字符串
   */
  export const toHump = name => name.replace( /\_(\w)/g, function ( all, letter ) {
    return letter.toUpperCase()
  } )