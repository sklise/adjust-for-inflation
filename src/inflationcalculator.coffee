cpis = {
  2014:233.069,
  2013:233.069,
  2012:229.594,
  2011:224.939,
  2010:218.056,
  2009:214.537,
  2008:215.303,
  2007:207.342,
  2006:201.6,
  2005:195.3,
  2004:188.9,
  2003:184.0,
  2002:179.9,
  2001:177.1,
  2000:172.2
}

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
    false

get_value = (id) -> $(id).val()

$(->
  _.each _.range(0,10), (n) ->
    bind_number_key(n, "#input-val")
  bind_decimal "#decimal", "#input-val"
  bind_delete_key "#delete", "#input-val"
  bind_select "#start-year", "#input-val"
  bind_select "#end-year", "#input-val"
  bind_swap "#swap", "#start-year", "#end-year", '#input-val'
  $('#input-val').on 'input', ->
    $("#output-val").html discount(cpis, get_value("#input-val"), get_value('#start-year'), get_value('#end-year'))
)