CREATE DATABASE TutorFinder;
GO

USE TutorFinder;
GO
CREATE TABLE Users (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PhoneNumber NVARCHAR(15) UNIQUE NOT NULL,
    Role NVARCHAR(10) CHECK (Role IN ('Student', 'Tutor', 'Admin','System Admin')) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);
CREATE TABLE Tutors (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT UNIQUE NOT NULL,
    Gender BIT NOT NULL, -- 0: Male, 1: Female
    DateOfBirth DATE NOT NULL,
    Address NVARCHAR(255) NOT NULL,
    Qualification NVARCHAR(255) NOT NULL,
    Experience INT CHECK (Experience >= 0),
    Bio NVARCHAR(MAX),
	Status int,
    FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE CASCADE
);
CREATE TABLE Students (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT UNIQUE NOT NULL,
    ParentName NVARCHAR(100),
    Grade NVARCHAR(20),
    Address NVARCHAR(255),
    Notes NVARCHAR(MAX),
    FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE CASCADE
);
CREATE TABLE Subjects (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    SubjectName NVARCHAR(100) UNIQUE NOT NULL,
    Description NVARCHAR(MAX)
);
CREATE TABLE TutorSubjects (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TutorID INT NOT NULL,
    SubjectID INT NOT NULL,
    FOREIGN KEY (TutorID) REFERENCES Tutors(ID) ON DELETE CASCADE,
    FOREIGN KEY (SubjectID) REFERENCES Subjects(ID) ON DELETE CASCADE,
    UNIQUE (TutorID, SubjectID) -- Đảm bảo một gia sư không đăng ký trùng môn
);
CREATE TABLE Classes (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TutorID INT NOT NULL,
    StudentID INT NOT NULL,
    SubjectID INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE,
    Status NVARCHAR(20) CHECK (Status IN ('Pending', 'Ongoing', 'Completed')) NOT NULL DEFAULT 'Pending',

    FOREIGN KEY (TutorID) REFERENCES Tutors(ID) ON DELETE CASCADE,
    FOREIGN KEY (StudentID) REFERENCES Students(ID) ON DELETE NO ACTION,
    FOREIGN KEY (SubjectID) REFERENCES Subjects(ID) ON DELETE NO ACTION
);



CREATE TABLE Schedules (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    ClassID INT NOT NULL,
    Date DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    FOREIGN KEY (ClassID) REFERENCES Classes(ID) ON DELETE CASCADE
);
CREATE TABLE Reviews (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    StudentID INT NOT NULL,
    TutorID INT NOT NULL,
    Rating INT CHECK (Rating BETWEEN 1 AND 5) NOT NULL,
    Comment NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (StudentID) REFERENCES Students(ID) ,
    FOREIGN KEY (TutorID) REFERENCES Tutors(ID) 
);
CREATE TABLE Messages (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    SenderID INT NOT NULL,
    ReceiverID INT NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    SentAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (SenderID) REFERENCES Users(ID) ,
    FOREIGN KEY (ReceiverID) REFERENCES Users(ID) 
);
CREATE TABLE Post (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,  -- Người đăng bài
    SubjectID INT NOT NULL,  -- Môn học cần review
    Title NVARCHAR(255) NOT NULL,  -- Tiêu đề bài đăng
    Content NVARCHAR(MAX) NOT NULL,  -- Nội dung bài viết
    Rating INT CHECK (Rating BETWEEN 1 AND 5),  -- Đánh giá từ 1-5 sao
    CreatedAt DATETIME DEFAULT GETDATE(),  -- Ngày đăng bài
    UpdatedAt DATETIME DEFAULT GETDATE(),  -- Ngày cập nhật bài

    FOREIGN KEY (UserID) REFERENCES Users(ID) ,
    FOREIGN KEY (SubjectID) REFERENCES Subjects(ID) 
);



