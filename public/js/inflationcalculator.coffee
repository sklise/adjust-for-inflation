discount = (table, amount, start_year, end_year=(new Date()).getFullYear()) ->
  (amount * (table[end_year] / table[start_year])).toFixed(2)

bind_number_key = (n, input) ->
  $("#key-#{n}").click ->
    previous = $(input).html()
    $(input).html("#{previous}#{n}")
    $(input).trigger('input')
    false

bind_select = (select, input) ->
  $(select).change ->
    $(input).trigger('input')

bind_delete_key = (del, input) ->
  $(del).click ->
    previous = $(input).val()
    $(input).val(previous.substr(0,previous.length-1))
    $(input).trigger('input')

bind_decimal = (decimal, input) ->
  $(decimal).click ->
    previous = $(input).html()
    console.log previous
    return false if _.contains(previous, ".") && previous.length > 0

    if previous.length is 0
      $(input).html("0.")
    else
      $(input).html("#{previous}.")
    $(input).trigger('input')

bind_swap = (swap, start, end, input) ->
  $(swap).click ->
    start_val = $(start).val()
    end_val = $(end).val()
    parseInt end_val
    $(start).val(parseInt end_val)
    $(end).val(parseInt start_val)
    $(input).trigger('input')
    $(@).toggleClass('reversed')
    false

get_value = (id) -> $(id).val()

YearOption = React.createClass
  render: ->
    (React.DOM.option {value:@props.year, children:@props.year})

YearSelect = React.createClass
  getInitialState: -> data: cpis
  render: ->
    React.DOM.select {className:"year-select", id: @props.id},
      _.map(@state.data, (cpis,year) -> (YearOption {year:year}))

YearSelects = React.createClass
  render: ->
    React.DOM.div {id:"year-selects"},
      YearSelect({id:"start-year", data:cpis}),
      React.DOM.a({href:"#",id:"swap"},"➣"),
      YearSelect({id:"end-year", data:cpis})

NumberKey = React.createClass
  render: ->
    React.DOM.button {id:"key-#{@props.number}",onClick:@props.click}, @props.number

Monies = React.createClass
  getInitialState: -> result:0.00,input:0.00
  handleInput: (event) ->
    console.log true
  render: ->
    numberClick = @handleInput
    React.DOM.div null,
      React.DOM.div({id:"values"},
        React.DOM.div {id:"output-val"}, "$#{@state.result.toFixed(2)}"
        React.DOM.div {id:"input-val"}, "$#{@state.input.toFixed(2)}"),
      React.DOM.div({id:"keypad"},
        _.map(_.range(1,10), (n) -> (NumberKey {number:n, click: numberClick})),
        NumberKey {number:0}
      )

mobile = ->
  React.renderComponent(YearSelects(),document.getElementById("year-selects-container"))
  React.renderComponent(Monies(),document.getElementById("values-container"))

  FastClick.attach(document.body);
  # _.each _.range(0,10), (n) ->
    # bind_number_key(n, "#input-val")
  bind_decimal "#decimal", "#input-val"
  bind_delete_key "#delete", "#input-val"
  bind_select "#start-year", "#input-val"
  bind_select "#end-year", "#input-val"
  bind_swap "#swap", "#start-year", "#end-year", '#input-val'
  $('#input-val').on 'input', ->
    $("#output-val").html "$#{discount(cpis, $("#input-val").html(), get_value('#start-year'), get_value('#end-year'))}"

desktop = -> true

$(->
  # Adapted from http://detectmobilebrowsers.com/
  is_mobile = ((a,b) => if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) then true else false)(navigator.userAgent||navigator.vendor||window.opera)

  # if is_mobile then mobile()
  mobile()
)
