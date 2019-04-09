#!/usr/bin/env node

const client = require('request').defaults({
  followRedirect: false,
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    'Referer': 'http://www.dianping.com/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36',
    'Cookie': 's_ViewType=10; _lxsdk_cuid=16a011d3ad7c8-0d77fd9966d2e5-12376d51-384000-16a011d3ad8c8; _lxsdk=16a011d3ad7c8-0d77fd9966d2e5-12376d51-384000-16a011d3ad8c8; _hc.v=d687c16d-a221-fb2f-d0c8-a629cf3be844.1554796854; _lxsdk_s=16a011d3ad9-822-1a7-801%7C%7C49'
  }
})

const callback = (resolve) => (e, res, body) => resolve(body)
const get = (url) => new Promise(resolve => client.get(url, callback(resolve)))
const getRegValue = (reg, body) => reg.test(body) ? RegExp.$1 : ''
const getRegValues = (reg, body) => {
  let ret = []

  let t
  while ((t = reg.exec(body)) !== null) {
    ret.push(t[1])
  }

  return ret
}

const url = process.argv[2]

if (/^https?:\/\//i.test(url) === false) {
  console.log('参数不正确!', url)
  return
}

get(url).then((html) => {
  let reg = /data-shopid="(\d+)"/g

  let shopids = {}

  let shopid

  while ((shopid = reg.exec(html)) !== null) {
    shopids[shopid[1]] = 1
  }

  shopids = Object.keys(shopids)

  return shopids
}).then((shopids) => {
  if (Array.isArray(shopids) === false || shopids.length < 1) {
    console.log('获取商家列表为空!')
    return
  }

  return new Promise((resolve) => {
    (function load () {
      const shopid = shopids.shift()

      if (!shopid) {
        resolve()
        return
      }

      get(`http://www.dianping.com/shop/${shopid}`).then((html) => {
        let shop_name = getRegValue(/<h1 class="shop-name">\s+([\s\S]+?)<a class="/, html).trim()
        let tels = getRegValues(/itemprop="tel">(.+?)<\/span>/g, html)
        let address = getRegValue(/<div class="expand-info address" itemprop="street-address">([\s\S]+?)<\/div>/, html).replace(/<.+?>/g, '').replace('地址：', '').trim().replace(/\n/g, '').replace(/\s{2,}/g, ' ')


        if (shop_name && tels && address) {
          console.log([shop_name, tels.join('|'),  address].join(',\t'))
        }

        setTimeout(load, Math.random() * 5000 + 1000) // 延时一下, 再去请求下一个, 不然请求太快, 会被拦截
      })
    })();
  })
})
