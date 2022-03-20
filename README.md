# Pencil Backend Assessment

## Database Design
As questions are annotated by topics, there exists a relationship between questions and topics. As a topic can annotate multiple questions, and a questions can have multiple annotations, there is a many-to-many relationship between the two. Further, as a topic can have many sub-topics, there is also a One-to-Many relationship between a topic and its sub-topics. 

To capture the many-to-many relationship between questions and topics, we can link the two by references. It appears that the numbers of read requests will far exceed the write load on database, we can use two-way linking where a question will have references to all the topics annotating it, and a topic will have references to all the questions it annotates. This two-way linking will have some extra load when writing, updating, or deleting documents, but the performance gain for read requests will be greater. If there is any possibility of a topic annotating so many questions that the references will push the size of topic document to exceed 16MB limit, then it would be better to maintain a one-way linking from questions to topics, as a question can only have atmost 5 annotations.

To capture the one-to-many relationship between a topic and its sub-topics, we can link by references whereby a topic will contain an array of references to all its children sub-topics. This will allow us to use the graphLookup in aggregate pipeline and get all the topics in a subtree of a specific topic. 

### Schema
```
topics = {
  topicLevel: int,
  text: string,
  questionIds: [], //references to questions a topic annotates
  children: [] //references to sub-topics
}

questions = {
  questionNumber: int,
  annotations: [] //references to topics
}
```
### Indexes
As requests will contain complete case-sensitive topic strings, an ascending index on topic's text is used. Use of text index will be required if partial keyword search is desired. As we are looking up questions in aggregate pipeline from references in topics, there are no indexes required on question collection. However, that can change if additional functionality is desired where questions collection is queried directly.

## Testing
Automated tests were implemented using jest and supertest.

It was also manually tested using postman with mock data.

## Hosting
The database is hosted on free tier of atlas.

The server is hosted on heroku. It goes down after 30 minutes of idling, so first request may take a few seconds.

### Example URLs
* https://pencil-be-assessment.herokuapp.com/search?Cell%20Structure%20and%20Organisation
  
  Expected response: [2,3,7,8,11,15,19,21,23,41,45,48,50,56,59,64,66,76,82,83,87,94,96,100,105,115,117,118,121,123,132,139,142,147,156,163,164,171,176,184,188,189,190,196]

* https://pencil-be-assessment.herokuapp.com/search?q=List%20the%20chemical%20elements%20which%20make%20up

  Expected response: [14,37,61,92,111,116,120,128,134,182]
  
* https://pencil-be-assessment.herokuapp.com/search?q=Cytoplasm

  Expected response: [8,21,76,83,142,188]

* https://pencil-be-assessment.herokuapp.com/search?q=State%2C%20in%20simple%20terms%2C%20the%20relationship%20between%20cell%20function%20and%20cell%20structure%20for%20the%20following%3A

  Expected response: [7,56,105,117,132,139,147,171,188,196]
  
