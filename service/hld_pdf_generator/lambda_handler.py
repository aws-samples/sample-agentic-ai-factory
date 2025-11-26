import boto3
import subprocess
import tempfile
import os
import json

s3 = boto3.client('s3')

def handler(event, context):
    """
    Lambda handler triggered by S3 event when high_level_design.md is created.
    Generates PDF from markdown using pandoc.
    """
    print(f"Event: {json.dumps(event)}")
    
    try:
        # Parse S3 event
        record = event['Records'][0]
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        print(f"Processing: s3://{bucket}/{key}")
        
        # Validate it's the HLD markdown file
        if not key.endswith('/design/high_level_design.md'):
            print(f"Skipping non-HLD file: {key}")
            return {'statusCode': 200, 'body': 'Skipped'}
        
        # Download markdown from S3
        with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as tmp_md:
            response = s3.get_object(Bucket=bucket, Key=key)
            markdown_content = response['Body'].read().decode('utf-8')
            tmp_md.write(markdown_content)
            tmp_md_path = tmp_md.name
        
        # Generate PDF path
        tmp_pdf_path = tmp_md_path.replace('.md', '.pdf')
        
        # Run pandoc to generate PDF
        # Set TEXMFVAR to /tmp for TeX cache (Lambda filesystem is read-only)
        env = os.environ.copy()
        env['TEXMFVAR'] = '/tmp/texmf-var'
        
        result = subprocess.run([
            'pandoc',
            tmp_md_path,
            '-o', tmp_pdf_path,
            '--pdf-engine=xelatex',
            '-V', 'geometry:margin=1in',
            '--toc',
            '--toc-depth=2',
            '--from=markdown+hard_line_breaks'
        ], capture_output=True, text=True, check=True, env=env)
        
        print(f"Pandoc output: {result.stdout}")
        
        # Upload PDF to S3 (same location, different extension)
        pdf_key = key.replace('.md', '.pdf')
        with open(tmp_pdf_path, 'rb') as pdf_file:
            s3.put_object(
                Bucket=bucket,
                Key=pdf_key,
                Body=pdf_file.read(),
                ContentType='application/pdf'
            )
        
        # Clean up temp files
        os.unlink(tmp_md_path)
        os.unlink(tmp_pdf_path)
        
        print(f"✅ PDF generated: s3://{bucket}/{pdf_key}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'PDF generated successfully',
                'pdf_location': f's3://{bucket}/{pdf_key}'
            })
        }
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Pandoc error: {e.stderr}")
        raise
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise
