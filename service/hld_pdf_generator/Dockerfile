FROM public.ecr.aws/lambda/python:3.12

# Install pandoc and LaTeX for PDF generation
RUN dnf update -y && \
    dnf install -y \
    wget \
    tar \
    gzip \
    && dnf clean all

# Install pandoc
RUN wget https://github.com/jgm/pandoc/releases/download/3.1.11/pandoc-3.1.11-linux-amd64.tar.gz && \
    tar xvzf pandoc-3.1.11-linux-amd64.tar.gz --strip-components 1 -C /usr/local && \
    rm pandoc-3.1.11-linux-amd64.tar.gz

# Install TeX Live (minimal for xelatex)
RUN dnf install -y \
    texlive \
    texlive-xetex \
    texlive-collection-fontsrecommended \
    && dnf clean all

# Copy Lambda handler
COPY lambda_handler.py ${LAMBDA_TASK_ROOT}/

# Set the CMD to your handler
CMD [ "lambda_handler.handler" ]
