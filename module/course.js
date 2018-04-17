const express = require('express');
const router = express.Router();
const fs = require('fs');
const Path = require('path');

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

router.post('/select', async (req, res) => {
  const {
    course_id,
    course_name,
    student_name
  } = req.body;

  try {
    let students = await filterStudent(req.body);
    let courses = await filterCourse(req.body);
    let stuId;

    const stuIndex = students.findIndex(item => item.student_name === student_name);
    if (stuIndex !== -1) {
      stuId = stuIndex + 1;
      let student = students[stuIndex];

      // 首先需将course表中已填入的该学生的上次所选课程内的姓名进行删除才可
      courses.forEach((item, index) => {
        if (item.id == student.course_id) {
          const index = item.students.findIndex(stu => stu.id == student.id);

          item.students.splice(index, 1);
        }
      });

      // 替换原来的课程内容
      student.course_id = course_id;
      student.course_name = course_name;
    } else {
      stuId = students.length + 1;
      students.push({
        id: stuId,
        ...req.body
      });
    }

    await writeFile(STUDENT_FILE, students);

    const courIndex = courses.findIndex(item => item.id == course_id);
    if (courIndex !== -1) {
      courses[courIndex].students.push({
        student_id: stuId,
        student_name
      });
    }
    
    await writeFile(COURSE_FILE, courses);

    res.json({
      errno: '200',
      errtext: 'success'
    })
  } catch (error) {
    res.json({
      errno: '403',
      errtext: error
    });
  }
})

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, function (err, data) {
      if (err) {
        return reject('读取文件异常');
      }

      resolve(JSON.parse(data));
    });
  });
}

function writeFile(filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(data), function (err) {
      if (err) {
        return reject('数据写入异常');
      }

      resolve();
    });
  })
}

async function filterStudent(data) {
  const {
    course_id,
    course_name,
    student_name
  } = data;
  let has_error = false;
  let errtext = '';
  let students;

  try {
    students = await readFile(STUDENT_FILE);
    const student = students.find(item => item.student_name === student_name);

    if (student) {
      if (student.course_id === course_id) {
        has_error = true;
        errtext = '你已选择该课程，请勿重复选择';
      }
    }
  } catch (error) {
    has_error = true;
    errtext = error;
  }

  return new Promise((resolve, reject) => {
    has_error ? reject(errtext) : resolve(students)
  })
}

async function filterCourse(data) {
  const {
    course_id,
    course_name,
    student_name
  } = data;
  let has_error = false;
  let errtext = '';
  let courses;

  try {
    courses = await readFile(COURSE_FILE);
    const course = courses.find(item => item.id == course_id);
    
    if (course) {
      if (course.students.length >= 3) {
        has_error = true;
        errtext = '该课程选取已超上限，请选取其他课程';
      }
    } else {
      has_error = true;
      errtext = '课程不存在, 请核对';
    }
  } catch (error) {
    has_error = true;
    errtext = error;
  }

  return new Promise((resolve, reject) => {
    has_error ? reject(errtext) :  resolve(courses);
  })
}

module.exports = router;