const express = require('express');
const fs = require('fs');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const course = require('./module/course');

const POOL_FILE = path.join(__dirname, 'data/pool.json');
const POOL_COPY_FILE = path.join(__dirname, 'data/pool_copy.json');

app.set('ranks', 0); // 设置队伍数
app.set('perRanksNum', 0); // 设置每队人数
app.set('pool', setTickets()); // 设置票池

//set root of the server.
app.use('/', express.static(path.join(__dirname, 'www')));

// 用body-parser插件解析请求数据
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/course', course);

app.post('/api/ticket/get', (req, res) => {
  const job_number = req.body.job_number;

  fs.readFile(POOL_FILE, function (err, data) {
    if (err) {
      console.log(err);
      process.exit(1);
    }

    var poolInfo = JSON.parse(data);

    for (var i = 0; i < poolInfo.length; i++) {
      if (poolInfo[i].job_number === job_number) {
        res.json({
          errno: '300',
          errtext: '你已抽取过，队伍号为 ' + poolInfo[i].number
        })
        return;
      }
    }

    let pool = app.get('pool');
    let index = parseInt(Math.random() * pool.length);
    let number, newData;

    if (pool.length > 0) {
      number = pool[index];
      pool.splice(index, 1);

      poolInfo.push({
        job_number,
        number
      });

      fs.writeFile(POOL_FILE, JSON.stringify(poolInfo), function (err) {
        if (err) {
          return res.json({
            errno: '300',
            errtext: '数据写入错误'
          });
        } else {
          return res.json({
            errno: '200',
            errtext: 'success',
            data: {
              number,
              remianed_pool: pool.length
            }
          });
        }
      });
    } else {
      res.json({
        errno: '300',
        errtext: '你来晚了，已经抽取完毕，囧rz...'
      });
    }
  })
});

app.post('/api/pool/set', (req, res) => {
  app.set('ranks', parseInt(req.body.ranks)); // 设置队伍数
  app.set('perRanksNum', parseInt(req.body.perRanksNum)); // 设置每队人数
  app.set('pool', setTickets());

  fs.writeFile(POOL_FILE, JSON.stringify([]), function(err) {
    if (err) {
      return res.json({ errno: '300', errtext: '数据写入错误' });
    } else {
      return res.json({ errno: '200', errtext: 'success' });
    }
  });
});

const server = app.listen(3000, () => {
  console.log('app listening at http://localhost:%s', 3000);
});

function setTickets() {
  let arr = [];
  for (let index = 1; index < app.get('ranks') + 1; index++) {
    for (let j = 0; j < app.get('perRanksNum'); j++) {
      arr.push(index);
    }
  }

  arr.sort((a, b) => {
    return Math.random() > 0.5 ? -1 : 1;
  });

  return arr;
}
