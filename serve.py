"""Local server for The Sunken Vigil. Run: python serve.py  then open http://localhost:8642"""
import http.server
import os
import socketserver

PORT = 8642
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript'}

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


with socketserver.ThreadingTCPServer(('', PORT), NoCacheHandler) as httpd:
    print(f'The Sunken Vigil is running at http://localhost:{PORT}')
    httpd.serve_forever()
