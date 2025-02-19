export default class Post {
    constructor(id, userID, fullname, subjectID, subjectname, title, content, rating, createdAt, updatedAt) {
        this.id = id;
        this.userID = userID;
        this.fullname = fullname;
        this.subjectID = subjectID;
        this.subjectname = subjectname;
        this.title = title;
        this.content = content;
        this.rating = rating;
        this.createdAt = new Date(createdAt).toLocaleDateString('vi-VN');
        this.updatedAt = new Date(updatedAt).toLocaleDateString('vi-VN');
    }
}