const Excel = require("exceljs");
const fs = require("fs");
const path = require("path");

const wb = new Excel.Workbook();
const filePath = path.resolve(__dirname, "Questions and Topics.xlsx");
// const filePath = path.resolve(__dirname, "mockData.xlsx");

wb.xlsx.readFile(filePath).then(() => {
  const sheetQuestions = wb.getWorksheet("Questions");
  const sheetTopics = wb.getWorksheet("Topics");

  //-------------------------Topics parsing--------------------------------

  const topicsHierarchy = {};
  let currentRow = 2;
  let maxColumns = 3;

  let currentRoot = sheetTopics.getCell(currentRow, 1).value?.trim();

  //generate a topics hierarch object
  while (currentRoot) {
    if (!topicsHierarchy[currentRoot]) topicsHierarchy[currentRoot] = {};

    let level1Node = topicsHierarchy[currentRoot];

    let level2Topic = sheetTopics.getCell(currentRow, 2).value?.trim();

    if (level2Topic) {
      if (!level1Node[level2Topic]) level1Node[level2Topic] = [];

      let level2Node = level1Node[level2Topic];

      let level3Topic = sheetTopics.getCell(currentRow, 3).value?.trim();

      if (level3Topic) {
        level2Node.push(level3Topic);
      }
    }

    currentRow++;
    currentRoot = sheetTopics.getCell(currentRow, 1).value?.trim();
  }

  const topicsArr = [];

  /*
  from topics hierarchy object, create topics object,
  where each topics has references to its children sub-topics.
  Use Extended JSON format to pass data-type information to mongoDB
  */
  Object.keys(topicsHierarchy).forEach((level1, index1) => {
    let id1 = (index1 + 1).toString();

    let level1Obj = {
      _id: id1,
      topicLevel: { "$numberInt": "1" },
      text: level1,
      questionIds: [],
      children: [],
    };
    topicsArr.push(level1Obj);

    Object.keys(topicsHierarchy[level1]).forEach((level2, index2) => {
      let id2 = index1 + 1 + "-" + (index2 + 1);
      let level2Obj = {
        _id: id2,
        topicLevel: { "$numberInt": "2" },
        text: level2,
        questionIds: [],
        children: [],
      };
      level1Obj.children.push(id2);
      topicsArr.push(level2Obj);

      topicsHierarchy[level1][level2].forEach((level3, index3) => {
        let id3 = index1 + 1 + "-" + (index2 + 1) + "-" + (index3 + 1);
        level2Obj.children.push(id3);
        topicsArr.push({
          _id: id3,
          topicLevel: { "$numberInt": "3" },
          text: level3,
          questionIds: [],
        });
      });
    });
  });

  console.log(topicsArr);

  //-------------------------Questions parsing--------------------------------
  currentRow = 2;
  maxColumns = 6;

  let questionsArr = [];

  let currentQuestionNum = sheetQuestions.getCell(2, 1).value;

  while (currentQuestionNum) {
    let annotations = [];

    let currentQuestion = {
      _id: currentQuestionNum.toString(),
      questionNumber: { "$numberInt": currentQuestionNum.toString() },
      annotations,
    };

    for (let i = 2; i <= maxColumns; i++) {
      let currentAnnotation = sheetQuestions
        .getCell(currentRow, i)
        .value?.trim();

      if (currentAnnotation) {
        /*
        for each question, find references to topics and add to annotations field
        Similarly, for each topic added as annotation to a question, 
        add reference to the question to questionIds field of topic objects.
        This is to ensure two-way linking of topics and questions using references.
        */
        let topic = topicsArr.find((topic) => topic.text === currentAnnotation);
        if (topic) {
          annotations.push(topic._id);
          topic.questionIds.push(currentQuestion._id);
        } else console.error(currentAnnotation);
      }
    }

    questionsArr.push(currentQuestion);

    currentRow++;
    currentQuestionNum = sheetQuestions.getCell(currentRow, 1).value;
  }

  //Write topics and questions to json files to be imported into separate collections in mongoDB
  fs.writeFileSync("topics.json", JSON.stringify(topicsArr), "utf8");
  fs.writeFileSync("questions.json", JSON.stringify(questionsArr), "utf8");
});
