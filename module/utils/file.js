const fs = require('fs');

const LIMIT_SELECT_NUM = 3; // 每个课程限制多少人选取

exports.readFile = function(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, function (err, data) {
      if (err) {
        return reject('读取文件异常');
      }

      resolve(JSON.parse(data));
    });
  });
}

exports.writeFile = function(filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(data), function (err) {
      if (err) {
        return reject('数据写入异常');
      }

      resolve();
    });
  })
}

exports.copyFile = function(src, dest) {
  return new Promise((resolve, reject) => {
    fs.copyFile(src, dest, (err) => {
      if (err) {
        return reject();
      }

      resolve();
    })
  })
}

/**
 * 过滤学生表中是否存在参数的学生
 * @param {object} data 
 */
exports.filterStudent = async function(data) {
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

/**
 * 过滤课程表中参数信息里的课程是否已达选择上限
 * @param {object} data 
 */
exports.filterCourse = async function(data) {
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
      if (course.students.length >= LIMIT_SELECT_NUM) {
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