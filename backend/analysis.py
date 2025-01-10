import time

def analyze_result(flow_data):
  nodes = flow_data['nodes']
  edges = flow_data['edges']

  print("Before sleep")
  time.sleep(20)  # Pauses execution for 5 seconds
  print("After sleep")

  # for edge in edges:
  #   print(edge)

  for node in nodes:
    print(node['data'])