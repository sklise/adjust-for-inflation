discount = (table, amount, start_year, end_year=(new Date()).getFullYear()) ->
  (amount * (table[end_year] / table[start_year])).toFixed(2)

bind_number_key = (n, input) ->
  $("#key-#{n}").click ->
    previous = $(input).val()
    $(input).val("#{previous}#{n}")
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
    previous = $(input).val()
    console.log previous
    return false if _.contains(previous, ".") && previous.length > 0

    if previous.length is 0
      $(input).val("0.")
    else
      $(input).val("#{previous}.")
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

$(->
  FastClick.attach(document.body);
  _.each _.range(0,10), (n) ->
    bind_number_key(n, "#input-val")
  bind_decimal "#decimal", "#input-val"
  bind_delete_key "#delete", "#input-val"
  bind_select "#start-year", "#input-val"
  bind_select "#end-year", "#input-val"
  bind_swap "#swap", "#start-year", "#end-year", '#input-val'
  $('#input-val').on 'input', ->
    $("#output-val").html "$#{discount(cpis, get_value("#input-val"), get_value('#start-year'), get_value('#end-year'))}"
)
