const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const {
  readFile,
  writeFile,
  copyFile,
  filterStudent,
  filterCourse
} = require('./utils/file');

const COURSE_FILE = path.join(__dirname, '../data/course.json');
const CLONE_COURSE_FILE = path.join(__dirname, '../data/course_copy.json');
const STUDENT_FILE = path.join(__dirname, '../data/students.json');

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

// 获取课程列表
router.get('/getList', async (req, res) => {
  try {
    const courses = await readFile(COURSE_FILE);
    res.json({
      errno: '200',
      errtext: 'success',
      data: courses
    });
  } catch (error) {
    res.json({
      errno: '403',
      errtext: error
    })
  }
})

// 获取学生列表
router.get('/student/getList', async (req, res) => {
  try {
    const courses = await readFile(STUDENT_FILE);
    res.json({
      errno: '200',
      errtext: 'success',
      data: courses
    });
  } catch (error) {
    res.json({
      errno: '403',
      errtext: error
    })
  }
})

router.post('/student/delete', async (req, res) => {
  const {
    id,
    course_id,
    course_name,
    student_name
  } = req.body;

  try {
    let students = await readFile(STUDENT_FILE);
    let courses = await readFile(COURSE_FILE);

    const stuIndex = students.findIndex(item => item.id == id);
    if (stuIndex !== -1) {
      // 从学生表中删除学生信息
      students.splice(stuIndex, 1);

      // 从课程表中删除已选学生信息
      courses.forEach((item, index) => {
        if (item.id == course_id) {
          const index = item.students.findIndex(stu => stu.student_id == id);
          item.students.splice(index, 1);
        }
      });

    } else {
      throw new Error('未查找到该学生信息');
    }

    await writeFile(STUDENT_FILE, students);
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

// 重置数据
router.get('/reset', async (req, res) => {
  try {
    await copyFile(CLONE_COURSE_FILE, COURSE_FILE);
    await writeFile(STUDENT_FILE, []);
    res.json({
      errno: '200',
      errtext: 'success'
    });
  } catch (error) {
    res.json({
      errno: '403',
      errtext: '重置操作异常，请重试'
    })
  }
})

// 选课
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
          const index = item.students.findIndex(stu => stu.student_id == student.id);

          if (index !== -1) {
            item.students.splice(index, 1);
          }
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

module.exports = router;