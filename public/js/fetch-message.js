function createNode(element) {
    return document.createElement(element);
}

function append(parent, el) {
    return parent.appendChild(el);
}

const ul = document.getElementById('allMessages');
const url = 'http://localhost:3000/messages';

fetch(url)
    .then((resp) => resp.json())
    .then(function(data) {
        console.log(data);
        let message = data;
        return message.map(function(data) {
            let li = createNode('li');
            li.innerHTML = data.user + ' : ' + data.message + ' ' + data.date;
            append(ul, li);
        })
    })
    .catch(function(error) {
        console.log(error);
    });
