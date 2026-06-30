// Calculation engine for course grades and OBE (CLO/PLO) metrics

export function calculateStudentGrades(students, assessments, marks, optionalGroups, gradeThresholds, passFailMode = 0, passMark = 50.0) {
  const assessmentMap = {};
  assessments.forEach(a => {
    assessmentMap[a.id] = a;
  });

  const optGroupMap = {};
  optionalGroups.forEach(g => {
    optGroupMap[g.id] = g;
  });

  const studentMarksMap = {};
  students.forEach(s => {
    studentMarksMap[s.matric_id] = [];
  });

  marks.forEach(m => {
    if (studentMarksMap[m.student_matric_id]) {
      studentMarksMap[m.student_matric_id].push(m);
    }
  });

  return students.map(student => {
    const sMarks = studentMarksMap[student.matric_id] || [];
    const scaledMarks = {};
    const rawMarks = {};

    assessments.forEach(a => {
      scaledMarks[a.id] = 0.00;
      rawMarks[a.id] = null;
    });

    const groupedMarks = {};

    sMarks.forEach(m => {
      const a = assessmentMap[m.assessment_id];
      if (!a) return;

      rawMarks[a.id] = m.raw_mark;
      const raw = m.raw_mark || 0;
      const scaled = a.max_mark > 0 ? (raw / a.max_mark) * a.weightage : 0;
      
      scaledMarks[a.id] = Number(scaled.toFixed(2));

      if (a.optional_group_id) {
        if (!groupedMarks[a.optional_group_id]) {
          groupedMarks[a.optional_group_id] = [];
        }
        groupedMarks[a.optional_group_id].push({
          assessment: a,
          scaled: scaled,
          raw: raw
        });
      }
    });

    // Sum standard questions
    let totalCW = 0;
    let totalE = 0;

    sMarks.forEach(m => {
      const a = assessmentMap[m.assessment_id];
      if (!a || a.optional_group_id) return;
      const raw = m.raw_mark || 0;
      const scaled = a.max_mark > 0 ? (raw / a.max_mark) * a.weightage : 0;
      if (a.type === 'CW') totalCW += scaled;
      if (a.type === 'E') totalE += scaled;
    });

    // Sum optional groups (best N)
    Object.keys(groupedMarks).forEach(groupId => {
      const optGroup = optGroupMap[groupId];
      const maxSelect = optGroup ? optGroup.max_selectable : 1;
      const marksInGroup = groupedMarks[groupId];

      marksInGroup.sort((a, b) => b.scaled - a.scaled);

      marksInGroup.forEach((item, index) => {
        if (index < maxSelect) {
          if (item.assessment.type === 'CW') totalCW += item.scaled;
          if (item.assessment.type === 'E') totalE += item.scaled;
        }
      });
    });

    const totalMark = Number((totalCW + totalE).toFixed(2));

    // Determine Grade
    let finalGrade = 'F';
    if (passFailMode === 1) {
      finalGrade = totalMark >= passMark ? 'Pass' : 'Fail';
    } else {
      const sortedThresholds = [...gradeThresholds].sort((a, b) => b.min_mark - a.min_mark);
      for (const t of sortedThresholds) {
        if (totalMark >= t.min_mark) {
          finalGrade = t.grade;
          break;
        }
      }
    }

    // CLO Scores - Simple sum of ALL scaled marks (matching Excel display column sum)
    // Note: Excel CLO score is the sum of the student's marks mapped to that CLO.
    // Since B1..B4 are optional, we only sum the ones they actually answered/selected.
    const cloScores = {};
    assessments.forEach(a => {
      if (!cloScores[a.clo_no]) {
        cloScores[a.clo_no] = 0;
      }
    });

    sMarks.forEach(m => {
      const a = assessmentMap[m.assessment_id];
      if (!a) return;
      const raw = m.raw_mark || 0;
      const scaled = a.max_mark > 0 ? (raw / a.max_mark) * a.weightage : 0;
      
      // For optional group, we only sum if it was among the best N selected.
      if (a.optional_group_id) {
        const groupList = groupedMarks[a.optional_group_id] || [];
        const isSelected = groupList
          .slice(0, optGroupMap[a.optional_group_id].max_selectable)
          .some(item => item.assessment.id === a.id);
        
        if (isSelected) {
          cloScores[a.clo_no] += scaled;
        }
      } else {
        cloScores[a.clo_no] += scaled;
      }
    });

    // PLO Scores - Similar logic
    const ploScores = {};
    assessments.forEach(a => {
      if (!ploScores[a.plo_no]) {
        ploScores[a.plo_no] = 0;
      }
    });

    sMarks.forEach(m => {
      const a = assessmentMap[m.assessment_id];
      if (!a) return;
      const raw = m.raw_mark || 0;
      const scaled = a.max_mark > 0 ? (raw / a.max_mark) * a.weightage : 0;
      
      if (a.optional_group_id) {
        const groupList = groupedMarks[a.optional_group_id] || [];
        const isSelected = groupList
          .slice(0, optGroupMap[a.optional_group_id].max_selectable)
          .some(item => item.assessment.id === a.id);
        
        if (isSelected) {
          ploScores[a.plo_no] += scaled;
        }
      } else {
        ploScores[a.plo_no] += scaled;
      }
    });

    Object.keys(cloScores).forEach(k => {
      cloScores[k] = Number(cloScores[k].toFixed(2));
    });
    Object.keys(ploScores).forEach(k => {
      ploScores[k] = Number(ploScores[k].toFixed(2));
    });

    return {
      matric_id: student.matric_id,
      name: student.name,
      programme: student.programme,
      rawMarks,
      scaledMarks,
      totalCW: Number(totalCW.toFixed(2)),
      totalE: Number(totalE.toFixed(2)),
      totalMark,
      grade: finalGrade,
      cloScores,
      ploScores
    };
  });
}

export function calculateObeMetrics(studentGrades, assessments, optionalGroups) {
  if (studentGrades.length === 0) return { cloMetrics: {}, ploMetrics: {} };

  // Calculate allocated full marks (weightage) for each CLO/PLO
  // In the spreadsheet, the allocated max is the simple sum of ALL question weightages (including all optional ones).
  const cloMax = {};
  const ploMax = {};
  
  assessments.forEach(a => {
    if (!cloMax[a.clo_no]) cloMax[a.clo_no] = 0;
    if (!ploMax[a.plo_no]) ploMax[a.plo_no] = 0;
    
    // Simple sum of all configured weights (matching Excel logic)
    cloMax[a.clo_no] += a.weightage;
    ploMax[a.plo_no] += a.weightage;
  });

  // Aggregate student scores for CLO
  const cloMetrics = {};
  Object.keys(cloMax).forEach(cloNo => {
    const maxWeight = cloMax[cloNo];
    
    // Average mark scored by active students (having totalMark > 0)
    const activeGrades = studentGrades.filter(s => s.totalMark > 0);
    const count = activeGrades.length || 1;
    
    const sumScores = activeGrades.reduce((sum, s) => sum + (s.cloScores[cloNo] || 0), 0);
    const avgScore = sumScores / count;
    
    const pctAvg = maxWeight > 0 ? (avgScore / maxWeight) * 100 : 0;
    
    // No of students scoring equal or more than 50% of the allocated CLO marks
    // Spreadsheet checks: Student score >= (maxWeight * 0.5)
    const passCount = studentGrades.filter(s => s.totalMark > 0 && (s.cloScores[cloNo] || 0) >= (maxWeight * 0.5)).length;
    
    // Density represents the percentage of ALL students in the class who pass
    const density = studentGrades.length > 0 ? (passCount / studentGrades.length) * 100 : 0;

    cloMetrics[cloNo] = {
      allocatedMax: Number(maxWeight.toFixed(2)),
      averageScore: Number(avgScore.toFixed(2)),
      percentageAverage: Number(pctAvg.toFixed(2)),
      passCount,
      density: Number(density.toFixed(2)),
      avgAchieved: pctAvg >= 50 ? 'Yes' : 'No',
      densityAchieved: density >= 50 ? 'Yes' : 'No'
    };
  });

  // Aggregate student scores for PLO
  const ploMetrics = {};
  Object.keys(ploMax).forEach(ploNo => {
    const maxWeight = ploMax[ploNo];
    
    const activeGrades = studentGrades.filter(s => s.totalMark > 0);
    const count = activeGrades.length || 1;
    
    const sumScores = activeGrades.reduce((sum, s) => sum + (s.ploScores[ploNo] || 0), 0);
    const avgScore = sumScores / count;
    
    const pctAvg = maxWeight > 0 ? (avgScore / maxWeight) * 100 : 0;
    
    const passCount = studentGrades.filter(s => s.totalMark > 0 && (s.ploScores[ploNo] || 0) >= (maxWeight * 0.5)).length;
    
    const density = studentGrades.length > 0 ? (passCount / studentGrades.length) * 100 : 0;

    ploMetrics[ploNo] = {
      allocatedMax: Number(maxWeight.toFixed(2)),
      averageScore: Number(avgScore.toFixed(2)),
      percentageAverage: Number(pctAvg.toFixed(2)),
      passCount,
      density: Number(density.toFixed(2)),
      avgAchieved: pctAvg >= 50 ? 'Yes' : 'No',
      densityAchieved: density >= 50 ? 'Yes' : 'No'
    };
  });

  return { cloMetrics, ploMetrics };
}
