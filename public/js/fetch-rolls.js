function createNode(element) {
    return document.createElement(element);
}

function append(parent, el) {
    return parent.appendChild(el);
}

const ul = document.getElementById('allRolls');
const url = 'http://localhost:3000/rolls';

fetch(url)
    .then((resp) => resp.json())
    .then(function (data) {
        console.log(data);
        let roll = data;
        return roll.map(function (data) {
            let li = createNode('li');
            li.innerHTML =
                data.playerName +
                ' : ' +
                data.rollValue +
                ' : ' +
                data.totalSum;
            append(ul, li);
        });
    })
    .catch(function (error) {
        console.log(error);
    });
