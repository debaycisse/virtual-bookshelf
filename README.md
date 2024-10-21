# virtual-bookshelf

### Virtual Bookshelf API

A robust RESTful API designed to emulate the functionality of a physical bookshelf. This backend-focused project empowers users to manage their book collections digitally, offering features akin to a traditional bookshelf. Key functionalities include:

Book Management: Add, edit, and delete books within your virtual bookshelf.
Category Management: Create, modify, and delete categories to organize your books effectively.
Shelf Management: Organize your books into virtual shelves for better categorization.

### Setup

- The following databases need to be installed on your system:
    1. MongoDB
    2. Redis Server

- After the two above databases have been installed, you need to clone the project using the git command:

```
git clone https://github.com/debaycisse/virtual-bookshelf.git
```

- Navigate to the root directory of the project, like so:

```
cd virtual-bookshelf
```

- Then, run the below command to install all necessary modules by running the below command.

```
npm install
```

- Run the installed Redis server

- Ensure you have executed the above commands and allowed them to complete their executions. Run the below command to run the development server.

```
npm run start-server
```

- You should see a message similar to the below on your screen.

```
Server running at http://127.0.0.1:5000
```

With that, you have successfully setup and started the server and it is ready to start taking and parsing queries or requests.


### Usage guildlines

For you to use the system, you have to:
- Create an account
- Login via the account to obtain a token, which will be used for subsequent requests you send to the server.
- Create a bookshelf
- Optionally, you can create a book category to organize your books into their respective categories or place them (books) into the bookshelf without organizing them at all.
- Create your books

#### Create account
To create an account, kindly use the ```/api/v1/user/register``` endpoint.
It takes name, email, and password. 

**Example**:

```
POST /api/v1/user/register

{
	"name": "John Doe",
	"email": "j.doe@example.com",
	"password": "DocMong%4$%123"
}
```

#### Login
To login to your already created account, kindly use ```/api/v1/user/login``` endpoint.
It takes only the registered *email* and *password* as a means of authentication and gives you a login token, which you will be using for your subsequent requests. The token is also contained in your response header, named **X-Token**

**Example**:

```
POST /api/v1/user/login

{
	"email": "j.doe@example.com",
	"password": "DocMong%4$%123" 
}
```

Ensure to save your login token.

From here onward, you will need to provide it in your authorization header as a means of authentication:

#### Create a bookshelf
You can create, modify, look up and delete a non-empty bookshelf. It only takes a name for the bookshelf

**Example**: Create a bookshelf
```
POST /api/v1/bookshelfs

{
    "name": "My Virtual Bookshelf 200"
}

```

#### Create a book category
You can use the book category to organize your books.
To use the book category, you need to create one and give the ID of the bookshelf where you would like to place it.

**Example**
```
POST /api/v1/categories

{
    "name": "IKEDC Receipt 200",
    "parentId": "67139fda2d437d31cb5130bf"
}
```

Where:
- name is the name of the category
- parentId is the ID of the bookshelf where you would like to place this category. You can use the returned ID after creating the bookshelf above.


#### Create a book
Here, you can:
1. Place your books directly into the bookshelf
2. Place your books into the book category for organization purposes.

**Example** - Place your books directly into the bookshelf

```
POST /api/v1/books

{
    "name": "The Pmp Project 2000",
    "author": "Azeez A.",
    "publishedInYear": 2024,
    "numberOfPages": 24,
    "bookshelfId": "67139fda2d437d31cb5130bf",
    "upload": "/home/azeez/Downloads/AIRLINE_RESERVATION_SYSTEM.pdf"
}
```

Where:
- name is the name you give to the book, which is about to be uploaded
- author is the author's name.
- publishedInYear is the year of publishing the book.
- numberOfPages is the number of pages of the book.
- bookshelfId is the ID of the bookshelf where you would plike to place the book.
- upload is the fulll path to the file you would like to place into the bookshelf.

_Note that you can omit all the other parameters except the bookshelfId and name._

**Example** - Place your books directly into a book category

```
POST /api/v1/books

{
    "name": "The Pmp Project 2000",
    "author": "Azeez A.",
    "publishedInYear": 2024,
    "numberOfPages": 24,
    "bookshelfId": "67139fda2d437d31cb5130bf",
    "categoryId": "67139fff2d437d31cb5130c0",
    "upload": "/home/azeez/Downloads/AIRLINE_RESERVATION_SYSTEM.pdf"
}
```

Where:
- name is the name you give to the book, which is about to be uploaded
- author is the author's name.
- publishedInYear is the year of publishing the book.
- numberOfPages is the number of pages of the book.
- bookshelfId is the ID of the bookshelf where you would plike to place the book.
- categoryId is the ID of the book cateory, which must exist in the bookshelf already.
- upload is the fulll path to the file you would like to place into the bookshelf.

_Note that you can omit all the other parameters except the bookshelfId and name._


### Overview of the project architecture

This project leverages the following key technologies:

- **MongoDB**
is utilized as the primary database for storing models such as users, bookshelves, book categories, and books. Each entity's data is persistently stored and managed within MongoDB.

- **Redis Server**
serves as a caching layer, temporarily storing user data for quick access when interacting with protected endpoints. This improves response time and enhances performance by reducing database load.

- **Express.js**
is the core framework powering the backend logic of the application. It handles routing, request processing, and serves as the main engine driving the system's functionality.
