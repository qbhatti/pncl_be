const topicsParser = (sheetTopics) => {
  const topics = {};
  let currentRow = 2;

  let currentRoot = sheetTopics.getCell(currentRow, 1).value?.trim();

  while (currentRoot) {
    if (!topics[currentRoot]) topics[currentRoot] = {};

    let level1Node = topics[currentRoot];

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
  Object.keys(topics).forEach((level1, index1) => {
    let id1 = (index1 + 1).toString();

    let level1Obj = {
      _id: id1,
      topicLevel: { $numberInt: "1" },
      text: level1,
      questionIds: [],
      children: [],
    };
    topicsArr.push(level1Obj);

    Object.keys(topics[level1]).forEach((level2, index2) => {
      let id2 = index1 + 1 + "-" + (index2 + 1);
      let level2Obj = {
        _id: id2,
        topicLevel: { $numberInt: "2" },
        text: level2,
        questionIds: [],
        children: [],
      };
      level1Obj.children.push(id2);
      topicsArr.push(level2Obj);

      topics[level1][level2].forEach((level3, index3) => {
        let id3 = index1 + 1 + "-" + (index2 + 1) + "-" + (index3 + 1);
        level2Obj.children.push(id3);
        topicsArr.push({
          _id: id3,
          topicLevel: { $numberInt: "3" },
          text: level3,
          questionIds: [],
        });
      });
    });
  });
};

const questionsParser = (sheetQuestions) => {};

module.exports = { topicsParser, questionsParser };
