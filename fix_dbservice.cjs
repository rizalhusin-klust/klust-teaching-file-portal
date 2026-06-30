const fs = require('fs');
let content = fs.readFileSync('server/dbService.js', 'utf8');

// Replace the query part
content = content.replace(
  'references_list = COALESCE(?, references_list)\n          WHERE id = ?`,\n          [\n            data.course_code, data.course_name, data.credit_hours, data.lecturer, data.email, data.room_no, \ndata.telephone, data.hp_no, data.consultation_hours, data.semester, data.start_date, data.end_date, data.session1_day, \ndata.session1_start, data.session1_end, data.session2_day, data.session2_start, data.session2_end, data.cw_weightage, \ndata.ex_weightage, data.pass_fail_mode, data.pass_mark, data.table4_path, data.portfolio_data, data.synopsis, \ndata.references_list,\n            courseId',
  'references_list = COALESCE(?, references_list),\n          program_name = COALESCE(?, program_name),\n          program_abb = COALESCE(?, program_abb)\n          WHERE id = ?`,\n          [\n            data.course_code, data.course_name, data.credit_hours, data.lecturer, data.email, data.room_no, data.telephone, data.hp_no, data.consultation_hours, data.semester, data.start_date, data.end_date, data.session1_day, data.session1_start, data.session1_end, data.session2_day, data.session2_start, data.session2_end, data.cw_weightage, data.ex_weightage, data.pass_fail_mode, data.pass_mark, data.table4_path, data.portfolio_data, data.synopsis, data.references_list, data.program_name, data.program_abb,\n            courseId'
);

// Also need to handle duplicateCourse in dbService.js
content = content.replace(
  'session2_end, cw_weightage, ex_weightage, pass_fail_mode, pass_mark, synopsis, references_list',
  'session2_end, cw_weightage, ex_weightage, pass_fail_mode, pass_mark, synopsis, references_list, program_name, program_abb'
);

fs.writeFileSync('server/dbService.js', content);
console.log("Updated dbService.js!");
