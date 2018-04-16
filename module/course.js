const express = require('express');
const router = express.Router();

const COURSE_FILE = Path.join(__dirname, '../data/course.json');
const STUDENT_FILE = Path.join(__dirname, '../data/students.json');
const LIMIT_SELECT_NUM = 3; // 每个课程限制多少人选取

/**
 * 选课流程：上传用户名和选课id及name，
 *    1.服务端查询students表
 *      1）如果存在该学生名已存在：如果选课内容重复，则返回错误已选
 *      2）如果内容不重复则进行下一步
 *    2.查询course表：
 *      1）课程未选满，写入学生信息，返回成功信息
 *      2）课程已选满，返回错误，课程无法选择
 *      
 */

router.get('/getList', function(req, res) {
  fs.readFile(COURSE_FILE, function (err, data) {
    if (err) {
      res.json({
        errno: '401',
        errtext: '读取course文件异常'
      });
    }

    const courses = JSON.parse(data);

    res.json({
      errno: '200',
      errtext: 'success',
      data: courses 
    });
  })
})

router.post('/select', function (req, res) {
  const {
    course_id,
    course_name,
    student_name
  } = req.body;

  readFile(COURSE_FILE).then(data => {
    const selectCourse = data.filter(item => item.id === course_id);
    if (selectCourse.students.length >= 3) {
      res.json({
        errno: '405',
        errtext: '该课程选取已超上限，请选取其他课程'
      })
    } else {
      data.forEach(course => {
        if (course.id === course_id) {
          couse.students.push({
            student_name
          })
        }
      });
      writeFile(COURSE_FILE, )
      res.json({
        errno: '200',
        errtext: 'success'
      });
    }
    
  }).catch(err => {
    res.json({
      errno: '403',
      errtext: err
    });
  })
})

const readFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, function (err, data) {
      if (err) {
        reject('读取文件异常');
      }

      resolve(JSON.parse(data));
    })
  })
}

const writeFile = (filePath, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(data), function (err) {
      if (err) {
        reject('数据写入异常');
      }

      resolve();
    });
  })
  
}

export default router;