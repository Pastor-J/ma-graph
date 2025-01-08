
def analyze_result(flow_data):
  nodes = flow_data['nodes']
  edges = flow_data['edges']

  # for edge in edges:
  #   print(edge)

  for node in nodes:
    print(node['data'])