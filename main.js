const $ = el => document.querySelector(el)
const $$ = el => document.querySelectorAll(el)

const $table = $('table')
const $body = $('tbody')
const $head = $('thead')
const ROWS = 20
const COLUMNS = 20
const FIRTS_CHAR_CODE = 65
const times = length => Array.from({length}, (_,i)=>i)
const getColumn = i => String.fromCharCode(FIRTS_CHAR_CODE+i)

let selectedColumn = null

let STATE = times(COLUMNS)
    .map(i=>times(ROWS).map(j=> ({computedValue:0, value:0})))
console.log(STATE)

function updateCell({x,y,value}){
    // copia profunda del array state, evitamos mutaciones
    const newState = structuredClone(STATE)
    const constants = generateCellConstants(newState)
    const cell = newState[x][y]
    //const computedValue = Number(value)
    cell.computedValue = computeValue(value, constants) // valor span
    cell.value = value // valor input
    newState[x][y] = cell

    computeAllCells(newState, generateCellConstants(newState))
    STATE = newState

    renderSpreadSheet()
}
//Funcion para traer los nombres y numeros de cada celda
function generateCellConstants(cells){
    return cells.map((rows,x)=> {
        return rows.map((cell, y)=>{
            const letter = getColumn(x)
            const cellId = `${letter}${y+1}` //se coloca +1 ya que la 0 es emcabezado
            return `const ${cellId} = ${cell.computedValue};`
        }).join('\n')
    }).join('\n')
}

function computeAllCells(cells, constants) {
    cells.forEach((rows,x) => {
        rows.forEach((cell,y) => {
            const computedValue = computeValue(cell.value, constants)
            cell.computedValue=computedValue
        })
        
    });
}

function computeValue(value, constants){
    if (typeof value === 'number') return value
    if(!value.startsWith('=')) return value

    const formula = value.slice(1)
        
        let computedValue
        try{
            computedValue =eval(`(()=>{
                ${constants}
                return ${formula};
                })()`)
        }
        catch (e){
            computedValue = `ERROR: ${e.message}`
        }
        return computedValue
   }

const renderSpreadSheet = () =>{
    const headerHTML = `<tr> 
            <th></th>
            ${times(COLUMNS).map(i => `<th>${getColumn(i)}</th>`).join('')}
        </tr>`
        $head.innerHTML=headerHTML

        const bodyHTML = times(ROWS).map(row =>{
            return `<tr> 
            <td>${row+1}
            ${times(COLUMNS).map(column => 
                `
                <td data-x="${column}" data-y="${row}">
                <span>${STATE[column][row].computedValue}</span>
                <input type="text" value="${STATE[column][row].value}"/>
                </td>
                `).join('')}
        </tr>`
        }).join(" ")

    $body.innerHTML = bodyHTML
}

$body.addEventListener('click', event=> {
    const td = event.target.closest('td')
    if (!td) return

    const  {x,y} = td.dataset
    const input = td.querySelector('input')
    const span = td.querySelector('span')
    const end = input.value.length
    input.setSelectionRange(end,end)
    input.focus()
    $$('.selected').forEach(el=>el.classList.remove('selected'))
    selectedColumn = null
    //Escucachamos evento de focus
    input.addEventListener('keydown',(event) => {
        if (event.key=== 'Enter')input.blur()
    })

    input.addEventListener('blur', () =>{
            console.log({value:input.value, state:STATE[x][y].value})
            if (input.value === STATE[x][y].value) return

            updateCell({x,y, value:input.value})

        }, {once:true})
    })

$head.addEventListener('click', event => {
    const th = event.target.closest('th')
    if(!th) return
    const x = [...th.parentNode.children].indexOf(th)
    if(x<=0)return

    selectedColumn = x-1

    $$('.selected').forEach(el =>el.classList.remove('selected'))
    th.classList.add('selected')
    $$(`tr td:nth-child(${x+1})`).forEach(el =>el.classList.add('selected'))

})

document.addEventListener('keydown', event =>{
    if(event.key === 'Backspace' && selectedColumn !== null)
    {
        times(ROWS).forEach(row=>{
            updateCell({x: selectedColumn, y:row, value:'0'})
        })
        renderSpreadSheet()
    }
})

//Evento de copiado de columna
document.addEventListener('copy', event => {
    if (selectedColumn !== null) {
        const columnValues = times(ROWS).map(row => {
            return STATE[selectedColumn][row].computedValue
        })
    event.clipboardData.setData('text/plain', columnValues.join('\n'))
    event.preventDefault()
    }
})

document.addEventListener('click', event => {
    const {target} = event

    const isThClicked = target.closest('th')
    const isTdClicked = target.closest('td')

    if(!isThClicked && !isTdClicked)
    {
        $$('.selected').forEach(el=>el.classList.remove('selected'))
        selectedColumn = null
    }

})

renderSpreadSheet()

